import express from 'express';
import db from '../db.js';
import QRCode from 'qrcode';
import { generateQrToken } from '../seedData.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all tables with QR URLs
router.get('/', async (req, res) => {
  try {
    const tables = db.prepare('SELECT * FROM tables ORDER BY table_number ASC').all();
    const host = req.protocol + '://' + req.get('host');

    const result = await Promise.all(tables.map(async t => {
      const orderUrl = `${host}/order?table=${t.table_number}&token=${t.qr_token}`;
      const qrDataUrl = await QRCode.toDataURL(orderUrl);
      return {
        ...t,
        order_url: orderUrl,
        qr_code_image: qrDataUrl
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate QR Code Token for Table
router.get('/validate', (req, res) => {
  try {
    const { table, token } = req.query;
    if (!table || !token) {
      return res.status(400).json({ valid: false, message: 'Table number and token required' });
    }

    const tableData = db.prepare('SELECT * FROM tables WHERE table_number = ?').get(table);
    if (!tableData) {
      return res.status(404).json({ valid: false, message: 'Table not found' });
    }

    if (tableData.qr_token !== token) {
      return res.status(401).json({ valid: false, message: 'Invalid or expired QR token' });
    }

    res.json({ valid: true, table: tableData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new table
router.post('/', async (req, res) => {
  try {
    const { table_number } = req.body;
    const restaurantId = 'rid_001';

    const existing = db.prepare('SELECT id FROM tables WHERE table_number = ?').get(table_number);
    if (existing) {
      return res.status(400).json({ error: `Table ${table_number} already exists` });
    }

    const id = `table_${table_number}`;
    const token = generateQrToken(restaurantId, table_number);

    db.prepare(`
      INSERT INTO tables (id, restaurant_id, table_number, qr_token, status)
      VALUES (?, ?, ?, ?, 'available')
    `).run(id, restaurantId, table_number, token);

    const newTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
    const host = req.protocol + '://' + req.get('host');
    const orderUrl = `${host}/order?table=${newTable.table_number}&token=${newTable.qr_token}`;
    const qrDataUrl = await QRCode.toDataURL(orderUrl);

    res.status(201).json({ ...newTable, order_url: orderUrl, qr_code_image: qrDataUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
